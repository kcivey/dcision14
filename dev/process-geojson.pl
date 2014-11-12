#!/usr/bin/perl -w
use strict;
use JSON;

@ARGV = ('April_23_2013_Special_Election_Unofficial_Results.csv') if not @ARGV;
$_ = <>;
chomp;
my %v;
my %ward;
my @columns = map { chomp; s/["\r\n]//g; lc } split /,/;
while (<>) {
    s/\s+$//;
    s/^"//; s/"$//;
    my %r;
    @r{@columns} = split /","/;
    next unless $r{contest_name} =~ /^AT\W*LARGE/
        and $r{candidate} !~ /ER VOTES$/;
    my $key2 = $r{ballot_name} || $r{candidate};
    $key2 =~ s/.* //;
    $key2 = ucfirst lc $key2;
    my $key1 = $r{precinct_number};
    if ($ward{$r{precinct_number}} && $ward{$r{precinct_number}} != $r{ward}) {
        warn "Precinct $r{precinct_number} is Ward $ward{$r{precinct_number}}" .
            " and $r{ward}\n";
    }
    $ward{$r{precinct_number}} = $r{ward};
    $v{$key1}{$key2} = $r{votes} + 0;
}
#use Data::Dumper; print Dumper \%v; exit;

@ARGV = ('dc-precincts-2012.json');
$/ = undef;
$_ = <>;
my $data = decode_json($_);
for my $f (@{$data->{features}}) {
    my $pct = $f->{properties}{Description} =~ /Precinct (\d+)/ ? $1 : 0;
    $f->{id} = 'pct' . $pct;
    $f->{properties} = {votes => $v{$pct}, ward => $ward{$pct}};
    $f->{geometry} = $f->{geometry}{geometries}[1];
}
#use Data::Dumper; print Dumper $data->{features}[0];
print to_json($data, {canonical => 1});
